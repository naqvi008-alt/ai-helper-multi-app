type Props = { onOpen: (id: string) => void };

const queue = [
  { id: "APP-22481", member: "Jane Member", amount: "$15,000", approved: "Today", status: "Approved" },
  { id: "APP-22467", member: "Sam O'Neill", amount: "$22,500", approved: "Yesterday", status: "E-sign pending" },
  { id: "APP-22458", member: "Lin Chen", amount: "$95,000", approved: "2 d ago", status: "Bank verify pending" },
  { id: "APP-22409", member: "Globex Corp", amount: "$140,000", approved: "3 d ago", status: "Approved" },
];

export default function Queue({ onOpen }: Props) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fulfillment queue</h1>
        <p className="page-subtitle">{queue.length} approved loans awaiting booking.</p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Approved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((a) => (
              <tr key={a.id} onClick={() => onOpen(a.id)}>
                <td>{a.id}</td>
                <td>{a.member}</td>
                <td>{a.amount}</td>
                <td>{a.approved}</td>
                <td>
                  <span
                    className={`tag-pill ${
                      a.status === "Approved" ? "tag-pill-success" : "tag-pill-warn"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
