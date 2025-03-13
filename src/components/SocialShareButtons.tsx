
import { Button } from "@/components/ui/button";

interface SocialShareButtonsProps {
  onShareSocial: (platform: string) => void;
}

const SocialShareButtons = ({ onShareSocial }: SocialShareButtonsProps) => {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-gray-200 hover:border-blue-500 hover:text-blue-500"
        onClick={() => onShareSocial('twitter')}
      >
        Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-gray-200 hover:border-blue-600 hover:text-blue-600"
        onClick={() => onShareSocial('facebook')}
      >
        Facebook
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-gray-200 hover:border-green-500 hover:text-green-500"
        onClick={() => onShareSocial('whatsapp')}
      >
        WhatsApp
      </Button>
    </div>
  );
};

export default SocialShareButtons;
