import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Success() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-green-100 p-4 mb-6">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Votre demande a bien été envoyée !
      </h1>
      <p className="text-lg text-slate-600 max-w-md mb-8">
        Les Bureaux d'Études de notre réseau ont été notifiés et reviendront vers vous avec des propositions de devis.
      </p>
      <Link to="/client/dashboard">
        <Button size="lg">Suivi des demandes de devis</Button>
      </Link>
    </div>
  );
}
