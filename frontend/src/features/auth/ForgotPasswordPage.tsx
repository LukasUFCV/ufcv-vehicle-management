import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { api, ApiError } from "../../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-app">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-soft">
          Saisissez votre adresse e-mail. En développement, le jeton de réinitialisation est
          affiché à l’écran si aucun service mail n’est configuré.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            setDevToken(null);

            try {
              const response = await api<{ message: string; resetToken?: string }>(
                "/auth/forgot-password",
                {
                  method: "POST",
                  body: JSON.stringify({ email })
                }
              );

              setMessage(response.message);
              setDevToken(response.resetToken ?? null);
            } catch (caught) {
              setError(
                caught instanceof ApiError ? caught.message : "Demande impossible pour le moment."
              );
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
            />
          </div>

          {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          {devToken ? (
            <div className="rounded-xl border border-border bg-surface-strong p-3 text-sm">
              <p className="font-medium">Jeton de développement</p>
              <code className="mt-2 block break-all font-mono text-xs">{devToken}</code>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}

          <Button type="submit" className="w-full">
            Générer un lien
          </Button>
        </form>

        <Link to="/login" className="mt-6 inline-block text-sm">
          Revenir à la connexion
        </Link>
      </Card>
    </div>
  );
}
