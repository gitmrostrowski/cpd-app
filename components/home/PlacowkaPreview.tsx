/** Podgląd panelu placówki (dane przykładowe) – Home i /dla-placowki. */
export default function PlacowkaPreview() {
  const people: Array<[string, string, string, boolean]> = [
    ["Anna Kowalska", "Kardiologia", "Właściciel", true],
    ["Piotr Nowak", "Kardiologia", "Administrator", true],
    ["Ewa Wiśniewska", "SOR", "Koordynator", true],
    ["m.zielinska@…", "SOR", "Pracownik", false],
  ];
  return <div className="panel role-panel" role="img" aria-label="Przykładowy panel placówki z jednostkami, rolami i zaproszeniem">
    <div className="panel-top">
      <div><p className="rp-kicker">Panel placówki</p><h2 className="rp-title">Szpital przykładowy</h2></div>
      <span className="pill pill-brand">3 jednostki</span>
    </div>
    <div className="rp-org">
      <ul className="rp-tree">
        <li className="on">Kardiologia<span>12 osób</span></li>
        <li>SOR<span>18 osób</span></li>
        <li>Pediatria<span>9 osób</span></li>
      </ul>
      <table className="table rp-people"><tbody>
        {people.map(([name, unit, roleName, active]) => <tr key={name}>
          <td>{name}<small>{unit}</small></td>
          <td>{roleName}</td>
          <td>{active ? <span className="pill pill-ok">Aktywny</span> : <span className="pill pill-warn">Zaproszenie wysłane</span>}</td>
        </tr>)}
      </tbody></table>
    </div>
    <p className="rp-soon">Status punktów zespołu i raporty zbiorcze w przygotowaniu.</p>
    <p className="rp-foot">Dane przykładowe</p>
  </div>;
}
