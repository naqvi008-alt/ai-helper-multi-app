type Props = { onApply: () => void };

export default function Dashboard({ onApply }: Props) {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Welcome back, Jane</h1>
        <p className="page-subtitle">Your accounts and applications.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Need a loan?</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Apply online in about 10 minutes. Auto, home, personal, or business — we've
            got you covered.
          </p>
          <button className="btn btn-primary" onClick={onApply}>
            Apply for a loan →
          </button>
        </div>
        <div className="card">
          <h3>Your accounts</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>**** 4421</td>
                <td>Checking</td>
                <td>$2,318.42</td>
              </tr>
              <tr>
                <td>**** 9930</td>
                <td>Savings</td>
                <td>$11,402.07</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
