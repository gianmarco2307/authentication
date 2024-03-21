import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// https://github.com/login/oauth/authorize?scope=user:email&client_id={}clientID
// A cui fare la richiesta

interface User {
  login: string;
  avatar_url: string;
}

interface OAuth2Props {
  getAuth: () => void;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const useOAuth2 = (): OAuth2Props => {
    const authorizeUrl = "https://github.com/login/oauth/authorize";
    const scope = "user";

    const getAuth = useCallback(() => {
      const clientID = process.env.REACT_APP_GITHUB_CLIENT_ID;
      const redirectUri = "http://localhost:3000/callback";
      window.location.href = `${authorizeUrl}?scope=${scope}&client_id=${clientID}&redirect_uri=${redirectUri}`;
    }, []);

    return { getAuth };
  };

  const { getAuth } = useOAuth2();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      axios
        .post<{ access_token: string }>("api/github/authenticate", {
          code,
          client_id: process.env.REACT_APP_GITHUB_CLIENT_ID,
          client_secret: process.env.REACT_APP_GITHUB_CLIENT_SECRET,
          redirect_uri: "http://localhost:3000/callback",
        })
        .then((response) => {
          const token = response.data.access_token;
          localStorage.setItem("githubToken", token);
          axios
            .get<User>("https://api.github.com/user", {
              headers: { Authorization: `token ${token}` },
            })
            .then((response) => setUser(response.data))
            .catch((error) =>
              console.error(
                "Errore nel recupero delle informazioni dell'utente: " + error
              )
            );
        })
        .catch((error) =>
          console.error("Errore nel recupero del token: " + error)
        );
    }
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <p>Benvenuto, {user.login}</p>
          <img src={user.avatar_url} alt="Avatar" />
        </div>
      ) : (
        <button>Login con GitHub</button>
      )}
    </div>
  );
}

export default App;
