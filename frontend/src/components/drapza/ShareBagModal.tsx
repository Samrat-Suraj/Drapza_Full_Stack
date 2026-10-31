"use client";

import React from "react";
import { ShareMyBagModal } from "./ShareMyBagModal";
import { CartItem } from "./CartDrawer";

interface ShareBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal?: number;
}

export const ShareBagModal: React.FC<ShareBagModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  return <ShareMyBagModal isOpen={isOpen} onClose={onClose} items={items} />;
};
