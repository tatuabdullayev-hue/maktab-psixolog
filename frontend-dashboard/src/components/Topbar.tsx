interface TopbarProps {
  title: string;
  school: string;
  district: string;
  date: string;
  onSchoolChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onDateChange: (v: string) => void;
}

export function Topbar({
  title,
  school,
  district,
  date,
  onSchoolChange,
  onDistrictChange,
  onDateChange,
}: TopbarProps) {
  return (
    <div className="topbar">
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__filters">
        <label className="topbar__field">
          <span className="topbar__label">Maktab</span>
          <input
            className="topbar__input"
            placeholder="masalan: 53-maktab"
            value={school}
            onChange={(e) => onSchoolChange(e.target.value)}
          />
        </label>
        <label className="topbar__field">
          <span className="topbar__label">Tuman</span>
          <input
            className="topbar__input"
            placeholder="masalan: Chortoq tumani"
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
          />
        </label>
        <label className="topbar__field">
          <span className="topbar__label">Sana</span>
          <input
            className="topbar__input"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
