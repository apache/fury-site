import { useEffect, type ReactNode } from 'react';
import { useWindowSize } from '@docusaurus/theme-common';
import {
  useLockBodyScroll,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarLayout from '@theme/Navbar/MobileSidebar/Layout';
import NavbarMobileSidebarHeader from '@theme/Navbar/MobileSidebar/Header';
import NavbarMobileSidebarPrimaryMenu from '@theme/Navbar/MobileSidebar/PrimaryMenu';
import NavbarMobileSidebarSecondaryMenu from '@theme/Navbar/MobileSidebar/SecondaryMenu';

const navbarDesktopBreakpoint = 1360;

export default function NavbarMobileSidebar(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const windowSize = useWindowSize({
    desktopBreakpoint: navbarDesktopBreakpoint,
  });
  const shouldRender = !mobileSidebar.disabled && windowSize === 'mobile';

  useEffect(() => {
    if (windowSize === 'desktop' && mobileSidebar.shown) {
      mobileSidebar.toggle();
    }
  }, [mobileSidebar, windowSize]);

  useLockBodyScroll(shouldRender && mobileSidebar.shown);

  if (!shouldRender) {
    return null;
  }

  return (
    <NavbarMobileSidebarLayout
      header={<NavbarMobileSidebarHeader />}
      primaryMenu={<NavbarMobileSidebarPrimaryMenu />}
      secondaryMenu={<NavbarMobileSidebarSecondaryMenu />}
    />
  );
}
