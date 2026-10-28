// Simulation notes (route arrival, engine overlaps) and the model caveats.
function Notes({ notes }) {
  return (
    <section className="notes" aria-label="Notes">
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
        <li>
          Nose temperature is the hot-wall radiative-equilibrium value at the stagnation point (physics-based at the
          nose only).
        </li>
      </ul>
    </section>
  )
}

export default Notes
