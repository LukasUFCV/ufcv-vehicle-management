import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { UfcvLogo } from "../../components/ui/UfcvLogo";
import { ApiError } from "../../lib/api";
import { useAuth } from "./useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/";

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[2rem] border border-border bg-black p-10 text-white shadow-soft">
          <UfcvLogo className="h-16 w-16 rounded-2xl p-2" imageClassName="scale-[0.96]" />
          <p className="mt-8 text-sm uppercase tracking-[0.24em] text-white/70">UFCV</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Réservez et pilotez la flotte sans Excel.</h1>
          <p className="mt-4 max-w-xl text-base text-white/75">
            RSVéhicule centralise les véhicules, les demandes, les conflits, les droits et les
            informations métier dans une interface sobre, sécurisée et adaptée au terrain.
          </p>
        </div>

        <Card className="self-center">
          <h2 className="text-2xl font-semibold text-app">Connexion</h2>
          <p className="mt-2 text-sm text-soft">
            Connectez-vous avec votre compte UFCV local pour accéder aux réservations et au parc.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setError(null);

              try {
                await login(email, password);
                navigate(nextPath, { replace: true });
              } catch (caught) {
                setError(
                  caught instanceof ApiError ? caught.message : "Connexion impossible pour le moment."
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-app">Adresse e-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="prenom.nom@ufcv.local"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-app">Mot de passe</label>
                <Link to="/mot-de-passe-oublie" className="text-sm text-brand-600 dark:text-brand-400">
                  Mot de passe oublié
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </div>

            {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-soft">
            Application interne UFCV. Aucun cookie de tracking n’est utilisé.
          </p>
        </Card>
      </div>
    </div>
  );
}
