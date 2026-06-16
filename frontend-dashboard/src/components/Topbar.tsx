interface TopbarProps {
  title: string;
  school: string;
  district: string;
  date: string;
  onSchoolChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onDateChange: (v: string) => void;
  hideDateFilter?: boolean;
}

export function Topbar({
  title,
  school,
  district,
  date,
  onSchoolChange,
  onDistrictChange,
  onDateChange,
  hideDateFilter = false,
}: TopbarProps) {
  return (
    <div className="topbar">
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__filters">
        <span className="topbar__filters-icon">⚙️</span>
        <label className="topbar__field">
          <span className="topbar__label">Maktab</span>
          <div className="topbar__input-wrap">
            <span className="topbar__input-icon">🏫</span>
            <input
              className="topbar__input topbar__input--readonly"
              value={school}
              readOnly
              onChange={(e) => onSchoolChange(e.target.value)}
            />
          </div>
        </label>
        <span className="topbar__divider" />
        <label className="topbar__field">
          <span className="topbar__label">Tuman</span>
          <div className="topbar__input-wrap">
            <span className="topbar__input-icon">📍</span>
            <input
              className="topbar__input topbar__input--readonly"
              value={district}
              readOnly
              onChange={(e) => onDistrictChange(e.target.value)}
            />
          </div>
        </label>
        {!hideDateFilter && (
          <>
            <span className="topbar__divider" />
            <label className="topbar__field">
              <span className="topbar__label">Sana</span>
              <div className="topbar__input-wrap">
                <span className="topbar__input-icon">📅</span>
                <input
                  className="topbar__input topbar__input--date"
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                />
              </div>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
