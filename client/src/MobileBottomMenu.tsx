import { NavLink as Link } from "react-router-dom";
import { isLoggedIn, logout } from "./auth";

const MobileBottomMenu = () => {
  const loggedIn = isLoggedIn();

  const handleLogOut = () => {
    logout();
    window.location.reload();
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <div className="bottom-mobile-menu">
      <NavLink path="/feed" title="Feed" iconClass="fa-solid fa-house" />
      <NavLink path="/feeds" title="Feeds" iconClass="fa-solid fa-bars" />

      <a href="#" onClick={handleLogOut} className="menu-item">
        <i className="fa-solid fa-right-from-bracket"></i>
        Log Out
      </a>
    </div>
  );
};

export default MobileBottomMenu;

const NavLink: React.FC<{ path: string; title: string; iconClass: string }> = ({
  path,
  title,
  iconClass,
}) => {
  return (
    <Link
      to={path}
      className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
    >
      <i className={iconClass}></i> {title}
    </Link>
  );
};
