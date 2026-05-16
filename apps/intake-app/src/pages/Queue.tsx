type Props = { onOpen: (id: string) => void };

const queue = [
  { id: "APP-22481", member: "Jane Member", amount: "$15,000", purpose: "Personal", submitted: "2 hr ago", status: "Awaiting KYC" },
  { id: "APP-22479", member: "Carlos Perez", amount: "$48,500", purpose: "Auto", submitted: "5 hr ago", status: "Awaiting KYC" },
  { id: "APP-22476", member: "Beth Wong", amount: "$280,000", purpose: "Home", submitted: "1 d ago", status: "Docs requested" },
  { id: "APP-22470", member: "ABC Holdings", amount: "$160,000", purpose: "Business", submitted: "2 d ago", status: "Awaiting KYC" },
];

export default function Queue({ onOpen }: Props) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Intake queue</h1>
        <p className="page-subtitle">{queue.length} applications waiting for review.</p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Purpose</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((a) => (
              <tr key={a.id} onClick={() => onOpen(a.id)} data-tour={`q-row-${a.id}`}>
                <td>{a.id}</td>
                <td>{a.member}</td>
                <td>{a.purpose}</td>
                <td>{a.amount}</td>
                <td>{a.submitted}</td>
                <td>
                  <span className="tag-pill tag-pill-warn">{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
