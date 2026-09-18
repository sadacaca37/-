import React from 'react';
import { TamagotchiView } from '../TamagotchiView';
import { UserSession } from '../../../types';

interface PlaygroundTamagotchiProps {
  currentUser: UserSession | null;
  onBack: () => void;
  onOpenProfile?: () => void;
}

export const PlaygroundTamagotchi: React.FC<PlaygroundTamagotchiProps> = ({
  currentUser,
  onBack,
  onOpenProfile,
}) => {
  return (
    <TamagotchiView
      currentUser={currentUser}
      onOpenProfile={onOpenProfile}
      isPlayground={true}
      onBack={onBack}
    />
  );
};
