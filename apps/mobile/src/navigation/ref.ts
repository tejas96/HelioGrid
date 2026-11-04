import { createNavigationContainerRef, type ParamListBase } from '@react-navigation/native';

/**
 * The navigator's handle for a part that lives above every screen — the billing denial
 * (`SCR-SHELL-06`): mounted once beside the navigator, since a stack keeps earlier screens mounted
 * and a host in each would open one denial per screen. Its own file, importing no screen, so a
 * screen may reach it without a loop through the routes.
 */
export const navigationRef = createNavigationContainerRef<ParamListBase>();
