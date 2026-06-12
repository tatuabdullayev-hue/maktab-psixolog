interface PlaceholderProps {
  title: string;
}

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="dashboard">
      <div className="topbar">
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="card">
        <p className="muted">Bu bo'lim tez orada ishga tushiriladi.</p>
      </div>
    </div>
  );
}
