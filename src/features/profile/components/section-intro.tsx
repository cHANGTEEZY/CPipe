type SectionIntroProps = {
  headingId: string;
  title: string;
  description: string;
};

export function SectionIntro({
  headingId,
  title,
  description,
}: SectionIntroProps) {
  return (
    <div className="lg:col-span-1">
      <h2
        id={headingId}
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
