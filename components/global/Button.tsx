interface ButtonProps {
  action: () => void;
  buttonName: string;
}

export default function Button(props: ButtonProps) {
  return (
    <div className="border-black border-4 outline outline-gradient-to-r outline-[#C89B3C]">
      <button
        type="button"
        className="bg-[#1E282D] px-14 py-3 text-2xl font-beaufort uppercase font-bold text-[#C8AA6E] hover:bg-[#1E2328]"
        onClick={props.action}
      >
        {props.buttonName}
      </button>
    </div>
  );
}
