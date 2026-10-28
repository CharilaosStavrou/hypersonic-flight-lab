// Collapsible sidebar section.
function EditorSection({ title, children, defaultOpen = true }) {
  return (
    <details className="editorSection" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="editorBody">{children}</div>
    </details>
  )
}

export default EditorSection
