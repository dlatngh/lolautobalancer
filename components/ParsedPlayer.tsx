interface ParsedPlayerProps {
  playerName: string;
}
export default function ParsedPlayer(
  props: ParsedPlayerProps
): React.ReactNode {
  return (
    <>
      <div
        className={`flex w-full font-beaufort uppercase text-lg items-center`}
      >
        {props.playerName}
      </div>
    </>
  );
}
