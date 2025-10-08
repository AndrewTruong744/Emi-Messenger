import Auth from "./Auth.jsx";
import Conversation from "./Conversation.jsx";
import Home from "./Home.jsx"
import Login from "./Login.jsx";
import Messages from "./Messages.jsx";
import NotFound from "./NotFound.jsx";
import Settings from "./Settings.jsx";
import Signup from "./Signup.jsx";

const routes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  
  // Protexted Routes
  {
    element: <Auth />,
    children: [
      {
        path: '/messages',
        element: <Messages />
      },
      {
        path: '/conversation/:user',
        element: <Conversation />
      },
      {
        path: '/settings',
        element: <Settings />
        //add children to this path
      }
    ]
  },

  //Page Not Found
  {
    path: '*',
    element: <NotFound />
  },
];

export default routes;