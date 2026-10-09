use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{mpsc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, State};

const EVENT: &str = "claude";
const MCP_MAX_BODY: usize = 1 << 20;
const SHELL_LOOKUP_TIMEOUT: Duration = Duration::from_secs(5);
const PATH_MARKER: &str = "__FLOATT_PATH__";
/// Where the installers put `claude`, for when the shell can't tell us. Relative to HOME; joining keeps
/// the absolute ones as they are.
const KNOWN_LOCATIONS: &[&str] = &[".local/bin/claude", "/opt/homebrew/bin/claude", "/usr/local/bin/claude"];

/// Set by Claude Code in its own subprocesses. If Floatt was launched from inside a Claude session
/// (a dev terminal), these would make our `claude` think it is a nested child of that session.
const PARENT_SESSION_VARS: &[&str] = &[
    "CLAUDECODE",
    "CLAUDE_CODE_CHILD_SESSION",
    "CLAUDE_CODE_ENTRYPOINT",
    "CLAUDE_CODE_SESSION_ID",
    "CLAUDE_CODE_SESSION_ATTENDED",
    "CLAUDE_CODE_MESSAGING_SOCKET",
    "CLAUDE_CODE_MESSAGING_TOKEN",
    "CLAUDE_CODE_EXECPATH",
    "CLAUDE_PID",
];

struct Running {
    child: Child,
    stdin: ChildStdin,
}

/// One `claude` at a time for the spike. Each start bumps `generation`, so output from a process we
/// replaced or killed never reaches the UI as if it came from the new one.
#[derive(Default)]
pub struct ClaudeProcess {
    running: Mutex<Option<Running>>,
    generation: AtomicU64,
}

impl ClaudeProcess {
    pub fn kill(&self) {
        if let Some(mut running) = self.running.lock().unwrap().take() {
            let _ = running.child.kill();
            let _ = running.child.wait();
        }
    }

    fn is_current(&self, generation: u64) -> bool {
        self.generation.load(Ordering::SeqCst) == generation
    }
}

pub struct McpServer {
    port: u16,
    token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartInfo {
    claude_path: String,
    found_by: &'static str,
}

/// Finds the `claude` the user's terminal runs: a path they set, else the first `claude` on their
/// interactive shell's PATH, else a known install location. A GUI app's own PATH is launchd's bare one.
fn find_claude(user_path: Option<&str>) -> Option<(PathBuf, &'static str)> {
    if let Some(path) = user_path.filter(|p| !p.is_empty()) {
        return Some((PathBuf::from(path), "user"));
    }
    if let Some(path) = shell_path().and_then(|path| first_on_path(&path)) {
        return Some((path, "shell"));
    }
    let home = PathBuf::from(std::env::var_os("HOME").unwrap_or_default());
    KNOWN_LOCATIONS
        .iter()
        .map(|location| home.join(location))
        .find(|path| path.is_file())
        .map(|path| (path, "known-location"))
}

/// The PATH an interactive login shell ends up with, which is what the user's terminal has. Read from
/// between markers because rc files can print anything, and given up on if the shell is slow.
fn shell_path() -> Option<String> {
    let shell = std::env::var("SHELL").ok().filter(|s| !s.is_empty())?;
    let script = format!("printf '\\n{PATH_MARKER}%s{PATH_MARKER}\\n' \"$PATH\"");
    let mut child = Command::new(shell)
        .args(["-ilc", &script])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    let stdout = child.stdout.take()?;
    let (lines_tx, lines) = mpsc::channel();
    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if lines_tx.send(line).is_err() {
                break;
            }
        }
    });
    let deadline = Instant::now() + SHELL_LOOKUP_TIMEOUT;
    let found = loop {
        match lines.recv_timeout(deadline.saturating_duration_since(Instant::now())) {
            Ok(line) => {
                if let Some(path) = between_markers(&line) {
                    break Some(path.to_string());
                }
            }
            Err(_) => break None,
        }
    };
    let _ = child.kill();
    let _ = child.wait();
    found
}

fn between_markers(line: &str) -> Option<&str> {
    let start = line.find(PATH_MARKER)? + PATH_MARKER.len();
    let length = line[start..].find(PATH_MARKER)?;
    Some(&line[start..start + length])
}

/// PATH lookup by hand rather than `command -v`, which would return an alias such as
/// `claude --dangerously-skip-permissions` instead of the binary.
fn first_on_path(path: &str) -> Option<PathBuf> {
    path.split(':')
        .filter(|dir| Path::new(dir).is_absolute())
        .map(|dir| Path::new(dir).join("claude"))
        .find(|candidate| candidate.is_file())
}

fn claude_args(mcp: &McpServer, resume: Option<&str>) -> Vec<String> {
    let mcp_config = json!({
        "mcpServers": {
            "floatt": {
                "type": "http",
                "url": format!("http://127.0.0.1:{}/mcp", mcp.port),
                "headers": { "Authorization": format!("Bearer {}", mcp.token) },
            }
        }
    });
    let mut args: Vec<String> = [
        "-p",
        "--output-format",
        "stream-json",
        "--input-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        // `stdio` routes every prompt to us as a `can_use_tool` control_request. It's the value the
        // Agent SDK passes; the docs only describe `--permission-prompts host`, which alone denies.
        "--permission-prompt-tool",
        "stdio",
        "--permission-mode",
        "default",
        // No `--setting-sources`: every source loads, as in the terminal, so whatever login works there
        // (settings `env`, `apiKeyHelper`, keychain) works here. Only hooks and auto memory are off.
        "--settings",
        r#"{"disableAllHooks":true,"autoMemoryEnabled":false}"#,
        "--strict-mcp-config",
        // ponytail: spike guard rails (cheapest model, read-only tools, small caps). FL-04 makes these per-session settings.
        "--model",
        "haiku",
        "--tools",
        "Read,Glob,Grep",
        "--max-turns",
        "6",
        "--max-budget-usd",
        "0.10",
    ]
    .map(String::from)
    .into();
    args.extend(["--mcp-config".into(), mcp_config.to_string()]);
    if let Some(id) = resume {
        args.extend(["--resume".into(), id.into()]);
    }
    args
}

#[tauri::command]
pub async fn claude_start(
    app: AppHandle,
    process: State<'_, ClaudeProcess>,
    mcp: State<'_, McpServer>,
    cwd: String,
    resume: Option<String>,
    claude_path: Option<String>,
) -> Result<StartInfo, String> {
    if !Path::new(&cwd).is_dir() {
        return Err(format!("Working folder not found: {cwd}"));
    }
    // The shell lookup can take a second; keep it off the main thread.
    let (path, found_by) =
        tauri::async_runtime::spawn_blocking(move || find_claude(claude_path.as_deref()))
            .await
            .map_err(|e| e.to_string())?
            .ok_or("Couldn't find `claude`. Install Claude Code or set its path.")?;
    // Bump first, so the old process's reader sees itself as stale before it can report an exit.
    let generation = process.generation.fetch_add(1, Ordering::SeqCst) + 1;
    process.kill();

    let mut command = Command::new(&path);
    command
        .args(claude_args(&mcp, resume.as_deref()))
        .current_dir(&cwd)
        .env("CLAUDE_CODE_DISABLE_AUTO_MEMORY", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for var in PARENT_SESSION_VARS {
        command.env_remove(var);
    }
    let mut child = command
        .spawn()
        .map_err(|e| format!("Couldn't start {}: {e}", path.display()))?;

    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");
    let stdin = child.stdin.take().expect("piped stdin");
    *process.running.lock().unwrap() = Some(Running { child, stdin });

    let stderr_app = app.clone();
    thread::spawn(move || {
        let process = stderr_app.state::<ClaudeProcess>();
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            eprintln!("[claude] {line}");
            if process.is_current(generation) {
                let _ = stderr_app.emit(EVENT, json!({ "type": "floatt_stderr", "line": line }));
            }
        }
    });
    thread::spawn(move || {
        let process = app.state::<ClaudeProcess>();
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if !process.is_current(generation) {
                return;
            }
            match serde_json::from_str::<Value>(&line) {
                Ok(message) => {
                    let _ = app.emit(EVENT, message);
                }
                Err(_) => eprintln!("[claude] non-JSON stdout: {line}"),
            }
        }
        if !process.is_current(generation) {
            return;
        }
        let code = process
            .running
            .lock()
            .unwrap()
            .take()
            .and_then(|mut running| running.child.wait().ok())
            .and_then(|status| status.code());
        let _ = app.emit(EVENT, json!({ "type": "floatt_exit", "code": code }));
    });

    Ok(StartInfo {
        claude_path: path.display().to_string(),
        found_by,
    })
}

/// Writes one stream-json message to `claude`'s stdin. Re-serialising keeps it to a single line.
#[tauri::command]
pub fn claude_send(process: State<ClaudeProcess>, message: Value) -> Result<(), String> {
    let mut guard = process.running.lock().unwrap();
    let running = guard.as_mut().ok_or("claude isn't running")?;
    writeln!(running.stdin, "{message}")
        .and_then(|_| running.stdin.flush())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn claude_stop(process: State<ClaudeProcess>) {
    process.kill();
}

/// A loopback MCP endpoint (Streamable HTTP, JSON responses only) so `claude` can call Floatt's tools.
/// ponytail: hand-rolled HTTP/1.1, one request per connection; swap for a real server when /hook lands (FL-03.3).
pub fn start_mcp_server() -> std::io::Result<McpServer> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).map_err(std::io::Error::other)?;
    let token: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    let expected_auth = format!("Bearer {token}");
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            let expected_auth = expected_auth.clone();
            thread::spawn(move || {
                let _ = serve_mcp(stream, &expected_auth);
            });
        }
    });
    Ok(McpServer { port, token })
}

fn serve_mcp(mut stream: TcpStream, expected_auth: &str) -> std::io::Result<()> {
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    reader.read_line(&mut request_line)?;
    let mut content_length = 0;
    let mut authorized = false;
    loop {
        let mut header = String::new();
        reader.read_line(&mut header)?;
        let header = header.trim_end();
        if header.is_empty() {
            break;
        }
        if let Some((name, value)) = header.split_once(':') {
            if name.eq_ignore_ascii_case("content-length") {
                content_length = value.trim().parse().unwrap_or(0);
            } else if name.eq_ignore_ascii_case("authorization") {
                authorized = value.trim() == expected_auth;
            }
        }
    }

    let (status, reply) = if !authorized {
        ("401 Unauthorized", None)
    } else if !request_line.starts_with("POST /mcp ") {
        ("405 Method Not Allowed", None)
    } else if content_length > MCP_MAX_BODY {
        ("413 Payload Too Large", None)
    } else {
        let mut body = vec![0; content_length];
        reader.read_exact(&mut body)?;
        match serde_json::from_slice::<Value>(&body) {
            Ok(request) => match handle_mcp(&request) {
                Some(reply) => ("200 OK", Some(reply)),
                None => ("202 Accepted", None),
            },
            Err(_) => ("400 Bad Request", None),
        }
    };
    let body = reply.map(|r| r.to_string()).unwrap_or_default();
    write!(
        stream,
        "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    )
}

/// JSON-RPC for one MCP request. Notifications (no `id`) get no reply.
fn handle_mcp(request: &Value) -> Option<Value> {
    let id = request.get("id")?.clone();
    let params = &request["params"];
    let result = match request["method"].as_str() {
        Some("initialize") => json!({
            "protocolVersion": params["protocolVersion"].as_str().unwrap_or("2025-06-18"),
            "capabilities": { "tools": {} },
            "serverInfo": { "name": "floatt", "version": env!("CARGO_PKG_VERSION") },
        }),
        Some("tools/list") => json!({ "tools": [{
            "name": "ping",
            "description": "Check that Floatt is listening. Echoes the message back.",
            "inputSchema": {
                "type": "object",
                "properties": { "message": { "type": "string" } },
                "required": ["message"],
            },
        }] }),
        Some("tools/call") if params["name"] == "ping" => json!({
            "content": [{
                "type": "text",
                "text": format!("pong from Floatt: {}", params["arguments"]["message"].as_str().unwrap_or("")),
            }],
        }),
        method => {
            return Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": { "code": -32601, "message": format!("Method not found: {}", method.unwrap_or("?")) },
            }))
        }
    };
    Some(json!({ "jsonrpc": "2.0", "id": id, "result": result }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mcp_ping_round_trip() {
        let call = json!({ "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": { "name": "ping", "arguments": { "message": "hi" } } });
        let reply = handle_mcp(&call).unwrap();
        assert_eq!(reply["id"], 3);
        assert_eq!(reply["result"]["content"][0]["text"], "pong from Floatt: hi");

        let notification = json!({ "jsonrpc": "2.0", "method": "notifications/initialized" });
        assert!(handle_mcp(&notification).is_none());

        let unknown = json!({ "jsonrpc": "2.0", "id": 4, "method": "server/discover" });
        assert_eq!(handle_mcp(&unknown).unwrap()["error"]["code"], -32601);
    }

    #[test]
    fn reads_the_path_out_of_noisy_shell_output() {
        let line = format!("\x1b[0mWelcome!{PATH_MARKER}/opt/x/bin:/usr/bin{PATH_MARKER}");
        assert_eq!(between_markers(&line), Some("/opt/x/bin:/usr/bin"));
        assert_eq!(between_markers("Welcome back"), None);
    }
}
