type Props = { onOpen: (id: string) => void };

const queue = [
  { id: "APP-22481", member: "Jane Member", amount: "$15,000", tier: "C", score: 678, dti: "31%" },
  { id: "APP-22467", member: "Sam O'Neill", amount: "$22,500", tier: "B", score: 712, dti: "27%" },
  { id: "APP-22458", member: "Lin Chen", amount: "$95,000", tier: "B", score: 731, dti: "38%" },
  { id: "APP-22441", member: "Marcus Reed", amount: "$8,000", tier: "D", score: 612, dti: "44%" },
];

export default function Queue({ onOpen }: Props) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Risk queue</h1>
        <p className="page-subtitle">
          {queue.length} forwarded applications awaiting credit decision.
        </p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Score</th>
              <th>Tier</th>
              <th>DTI</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((a) => (
              <tr key={a.id} onClick={() => onOpen(a.id)}>
                <td>{a.id}</td>
                <td>{a.member}</td>
                <td>{a.amount}</td>
                <td>{a.score}</td>
                <td>
                  <span className="tag-pill tag-pill-info">{a.tier}</span>
                </td>
                <td>{a.dti}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
