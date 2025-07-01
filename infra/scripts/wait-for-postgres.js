const { exec } = require("node:child_process");

let spinner = ["/", "/", "/", "/", "-", "-", "-", "-", "\\", "\\", "\\", "\\", "|", "|", "|", "|"];
let i = 0;
let awaitingMessage = "🛑 Awaiting for postgres";

function checkPostgres() {
  exec("docker exec tabnews-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.cursorTo(awaitingMessage.length + 1);
      process.stdout.write(`${spinner[i++ % spinner.length]}`);
      checkPostgres();
      return;
    }

    console.log("\n🟢 Postgres is ready");
  }
}

process.stdout.write(awaitingMessage);
checkPostgres();
