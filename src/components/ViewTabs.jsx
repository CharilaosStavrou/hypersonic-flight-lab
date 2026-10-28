const tabs = [
  { id: 'earth', label: 'Earth view' },
  { id: 'aircraft', label: 'Aircraft view' },
]

function ViewTabs({ active, onChange }) {
  return (
    <div className="viewTabs" role="tablist" aria-label="3D view">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`viewTab${active === tab.id ? ' viewTabActive' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default ViewTabs
