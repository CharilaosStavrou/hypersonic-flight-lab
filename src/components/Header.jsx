import FileButtons from './FileButtons.jsx'

function Header(props) {
  return (
    <header className="appHeader">
      <h1>Hypersonic Flight Lab</h1>
      <FileButtons {...props} />
    </header>
  )
}

export default Header
