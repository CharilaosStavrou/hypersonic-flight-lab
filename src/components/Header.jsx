function Header({ onNew }) {
  return (
    <header className="appHeader">
      <h1>Hypersonic Flight Lab</h1>
      <div className="headerActions">
        <button type="button" className="secondaryButton" onClick={onNew}>
          New
        </button>
      </div>
    </header>
  )
}

export default Header
