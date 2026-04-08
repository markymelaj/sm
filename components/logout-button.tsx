export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="btn btn-secondary" type="submit">Salir</button>
    </form>
  );
}
