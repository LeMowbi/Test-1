import { Screen } from '@/components/Screen';
import { Card, Txt } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function Legal() {
  return (
    <Screen back title="Mentions légales & CGU">
      <Card style={{ marginTop: spacing.sm }}>
        <Txt variant="h3">Conditions d'utilisation</Txt>
        <Txt variant="body" style={{ marginTop: spacing.sm }}>
          PadelConnect met en relation des joueurs et des clubs de padel à Abidjan (réservation de créneaux, recherche de partenaires,
          coachs et compétitions). Aucun paiement n'est effectué dans l'application : le règlement de la session se fait directement au
          club.
        </Txt>
        <Txt variant="body" style={{ marginTop: spacing.sm }}>
          Le niveau de jeu évolue uniquement via les tournois officiels : c'est l'organisateur du tournoi qui désigne l'équipe gagnante à la
          fin (il n'y a pas d'auto-déclaration de match). Les tarifs et disponibilités affichés sont indicatifs et relèvent de la
          responsabilité de chaque club.
        </Txt>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Txt variant="h3">Confidentialité</Txt>
        <Txt variant="body" style={{ marginTop: spacing.sm }}>
          Pour faire fonctionner ton compte, tes informations (profil, niveau, réservations, parrainage) sont enregistrées sur un serveur
          sécurisé (hébergé par Supabase) et synchronisées entre tes appareils. Tes données ne sont visibles que par toi ; un club ne voit
          que les réservations le concernant, et l'opérateur de PadelConnect le strict nécessaire au suivi du service.
        </Txt>
        <Txt variant="body" style={{ marginTop: spacing.sm }}>
          La connexion se fait par numéro de téléphone et mot de passe (sans vérification par SMS à ce stade). Aucun paiement en ligne n'est
          réalisé. Tu peux demander la suppression de ton compte et de tes données en nous écrivant à l'adresse ci-dessous, dans le respect
          de la réglementation ivoirienne (ARTCI) sur les données personnelles.
        </Txt>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Txt variant="h3">Contact</Txt>
        <Txt variant="body" style={{ marginTop: spacing.sm }}>
          PadelConnect · Abidjan
        </Txt>
        <Txt variant="muted">moustaphabitar01@gmail.com</Txt>
      </Card>

      <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.lg, textAlign: 'center' }}>
        Document simplifié de démonstration — à faire valider par un juriste avant la mise en ligne.
      </Txt>
    </Screen>
  );
}
