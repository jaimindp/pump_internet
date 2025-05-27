const ANIMATION_CLASSES = [
  "animate-fade-in",
  "animate-slide-in",
  "animate-scale-in",
];

const ContentCardComponent = function ContentCard({
  group,
  isPaused = false,
}: ContentCardProps) {
  const [contentEmbed, setContentEmbed] = useState<ContentEmbed | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const hasAttemptedLoad = useRef(false);
  const lastContentUrl = useRef<string>("");
  const [animationClass, setAnimationClass] = useState("");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      // Pick a random animation class on first mount
      const random = Math.floor(Math.random() * ANIMATION_CLASSES.length);
      setAnimationClass(ANIMATION_CLASSES[random]);
      hasAnimated.current = true;
      // Remove the animation class after 300ms for faster, more subtle animations
      setTimeout(() => setAnimationClass(""), 300);
    }
  }, []);
};
