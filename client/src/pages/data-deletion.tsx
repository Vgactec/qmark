import { Link } from "wouter";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Suppression des Données Utilisateur
          </h1>

          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Cette page explique comment demander la suppression de vos données personnelles 
              collectées par QMARK, conformément aux exigences de Facebook/Meta et au RGPD.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Comment supprimer vos données
              </h2>
              <div className="space-y-4">
                <p>Pour demander la suppression de vos données personnelles :</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Connectez-vous à votre compte QMARK</li>
                  <li>Accédez aux paramètres de votre compte</li>
                  <li>Cliquez sur "Supprimer mon compte" ou contactez-nous directement</li>
                  <li>Confirmez votre demande de suppression</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Données supprimées
              </h2>
              <p>Lors de la suppression de votre compte, nous supprimons :</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Vos informations personnelles (nom, email, profil)</li>
                <li>Vos connexions OAuth (Google, Facebook, Instagram, etc.)</li>
                <li>Vos leads et données de prospects</li>
                <li>Vos automations et workflows configurés</li>
                <li>Toutes les données d'activité et métriques associées</li>
                <li>Tous les tokens d'accès et informations d'authentification</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Délai de suppression
              </h2>
              <p>
                La suppression de vos données est effective immédiatement dans nos systèmes actifs. 
                Cependant, certaines données peuvent être conservées dans nos sauvegardes pendant 
                un maximum de 30 jours avant suppression définitive.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Données conservées
              </h2>
              <p>
                Nous pouvons conserver certaines informations anonymisées à des fins d'analyse 
                statistique ou légales, mais ces données ne permettront plus de vous identifier.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact pour la suppression
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email :</strong> support@qmark.app</p>
                <p><strong>Objet :</strong> Demande de suppression de données</p>
                <p className="mt-2 text-sm text-gray-600">
                  Veuillez inclure votre adresse email associée au compte et préciser 
                  "Suppression de données" dans l'objet de votre message.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Confirmation de suppression
              </h2>
              <p>
                Vous recevrez une confirmation par email une fois la suppression effectuée. 
                Cette action est irréversible et toutes vos données seront définitivement perdues.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Dernière mise à jour : 24 mai 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}