import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI);

  let text = "Carregando...";

  if (!isLoading && data) {
    text = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <p>Última atualização: {text}</p>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI);

  let text = "Carregando...";

  if (!isLoading && data) {
    text = (
      <>
        <p>Versão: {data.dependencies.database.version}</p>
        <p>Conexões abertas: {data.dependencies.database.opened_connections}</p>
        <p>Conexões máximas: {data.dependencies.database.max_connections}</p>
      </>
    );
  }

  return (
    <>
      <h2>Database</h2>
      <div>{text}</div>
    </>
  );
}
