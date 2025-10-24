type Props = {
  actions: React.ReactNode;
};

const TopBar = ({ actions }: Props) => {
  return (
    <nav className="top-bar">
      <div className="logo">
        <img src="/icon512.png" />
        <span>sRSSly</span>
      </div>
      <div className="actions">{actions}</div>
    </nav>
  );
};

export default TopBar;
