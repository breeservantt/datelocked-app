/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Chat from './pages/Chat';
import Consent from './pages/Consent';
import Dating from './pages/Dating';
import Goals from './pages/Goals';
import Home from './pages/Home';
import InvitePartner from './pages/InvitePartner';
import Memories from './pages/Memories';
import NightIn from './pages/NightIn';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Places from './pages/Places';
import Privacy from './pages/Privacy';
import Refunds from './pages/Refunds';
import RelationshipInsights from './pages/RelationshipInsights';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import VerifyStatus from './pages/VerifyStatus';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Consent": Consent,
    "Dating": Dating,
    "Goals": Goals,
    "Home": Home,
    "InvitePartner": InvitePartner,
    "Memories": Memories,
    "NightIn": NightIn,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Places": Places,
    "Privacy": Privacy,
    "Refunds": Refunds,
    "RelationshipInsights": RelationshipInsights,
    "Settings": Settings,
    "Terms": Terms,
    "VerifyStatus": VerifyStatus,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};