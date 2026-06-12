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
        <input
          className="topbar__input"
          placeholder="Maktab (masalan: 53-maktab)"
          value={school}
          onChange={(e) => onSchoolChange(e.target.value)}
        />
        <input
          className="topbar__input"
          placeholder="Tuman (masalan: Chortoq tumani)"
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
        />
        <input
          className="topbar__input"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
