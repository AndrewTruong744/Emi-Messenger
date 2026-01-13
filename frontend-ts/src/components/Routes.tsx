import Auth from "./Auth";
import Conversation from "./Conversation";
import Welcome from "./Welcome"
import Login from "./Login";
import LoginComplete from "./LoginComplete";
import Home from "./Home";
import NotFound from "./NotFound";
import Settings from "./Settings";
import Signup from "./Signup";
import FindPeople from "./FindPeople";

const routes = [
  {
    path: '/',
    element: <Welcome />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/login-complete',
    element: <LoginComplete />
  },
  
  // Protected Routes
  {
    element: <Auth />,
    children: [
      {
        path: '/home',
        element: <Home />,
        children: [
          {
            path: 'conversation/:id',
            element: <Conversation />
          },
          {
            path: 'find-people',
            element: <FindPeople />
          },
          {
            path: 'settings',
            element: <Settings />
            //add children to this path
          }
        ]
      },
    ]
  },

  //Page Not Found
  {
    path: '*',
    element: <NotFound />
  },
];

export default routes;