import { BeamModes } from "@/org/input-modes";
import { atom, useAtom, useAtomValue } from "jotai";
import Image from "next/image";

export const Keyboard = () => {
  return (
    <Root>
      <Header />
      <Container>
        <KeyRow>
          <NoteRestToggle />
          <Whole />
          <Half />
          <Quarter />
          <Backspace />
        </KeyRow>
        <KeyRow>
          <ArrowLeft />
          <Eighth />
          <Sixteenth />
          <ThirtySecond />
          <ArrowRight />
        </KeyRow>
        <KeyRow>
          <BeamToggle />
          <WhiteKey />
          <Dynamics />
          <Bars />
          <Return />
        </KeyRow>
        <KeyRow>
          <Accidentals />
          <Slur />
          <Accent />
          <Fermata />
          <Tie />
        </KeyRow>
      </Container>
      <Footer>
        {/* desktop only */}
        {/* <Handle /> */}
      </Footer>
    </Root>
  );
};

const noteInputModeAtom = atom<"note" | "rest">("note");

const NoteRestToggle = () => {
  const [noteInputMode, setNoteInputMode] = useAtom(noteInputModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <GrayKey onClick={() => setNoteInputMode("rest")}>
          <div className="relative w-2/3 h-2/3">
            <Image
              src="/img/r4.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      ) : (
        <GrayKey onClick={() => setNoteInputMode("note")}>
          <div className="relative w-1/5 h-2/3">
            <Image
              src="/img/n4.png"
              fill={true}
              alt="note mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
    </>
  );
};

const Whole = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-1/4 h-1/4 top-[15%]">
            <Image
              src="/img/n1.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-2/5 h-2/5">
            <Image
              src="/img/r1.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const Half = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-1/5 h-2/3">
            <Image
              src="/img/n2.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-2/5 h-2/5">
            <Image
              src="/img/r2.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const Quarter = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-1/5 h-2/3">
            <Image
              src="/img/n4.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-2/3 h-2/3">
            <Image
              src="/img/r4.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const Eighth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-full h-2/3">
            <Image
              src={beamMode === "nobeam" ? "/img/n8.png" : "/img/beam8.svg"}
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-1/5 h-full">
            <Image
              src="/img/r8.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const Sixteenth = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-full h-2/3">
            <Image
              src={beamMode === "nobeam" ? "/img/n16.png" : "/img/beam16.svg"}
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-1/5 h-full">
            <Image
              src="/img/r16.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const ThirtySecond = () => {
  const noteInputMode = useAtomValue(noteInputModeAtom);
  const beamMode = useAtomValue(beamModeAtom);
  return (
    <>
      {noteInputMode === "note" ? (
        <WhiteKey>
          <div className="relative w-full h-2/3">
            <Image
              src={beamMode === "nobeam" ? "/img/n32.png" : "/img/beam32.svg"}
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      ) : (
        <WhiteKey>
          <div className="relative w-1/5 h-full">
            <Image
              src="/img/r32.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </WhiteKey>
      )}
    </>
  );
};

const Backspace = () => (
  <GrayKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/backspace_black_24dp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const ArrowLeft = () => (
  <GrayKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/west_black_24dp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const ArrowRight = () => (
  <GrayKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/east_black_24dp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const beamModeAtom = atom<BeamModes>("beam");

const BeamToggle = () => {
  const [beamMode, setBeamMode] = useAtom(beamModeAtom);
  // TODO　ダブルクリック→"rock"
  return (
    <>
      {beamMode === "nobeam" && (
        <GrayKey onClick={() => setBeamMode("beam")}>
          <div className="relative w-1/2 h-1/2">
            <Image
              src="/img/nobeam.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
      {beamMode === "beam" && (
        <GrayKey onClick={() => setBeamMode("nobeam")}>
          <div className="relative w-1/2 h-1/2">
            <Image
              src="/img/beam.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </div>
        </GrayKey>
      )}
    </>
  );
};

const Dynamics = () => (
  <WhiteKey>
    <div className="relative w-3/5 h-3/5">
      <Image
        src="/img/dynamics.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Bars = () => (
  <WhiteKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/bars.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Return = () => (
  <GrayKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/keyboard_return_black_24dp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const Accidentals = () => (
  <GrayKey>
    <div className="relative w-1/5 h-2/5">
      <Image
        src="/img/sharp.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
    <div className="relative w-1/5 h-2/5">
      <Image
        src="/img/natural.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
    <div className="relative w-1/5 h-2/5">
      <Image
        src="/img/flat.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const Slur = () => (
  <WhiteKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/slur.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Accent = () => (
  <WhiteKey>
    <div className="relative w-2/5 h-2/5">
      <Image
        src="/img/accent.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Fermata = () => (
  <WhiteKey>
    <div className="relative w-1/4 h-1/4">
      <Image
        src="/img/fermata.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </WhiteKey>
);

const Tie = () => (
  <GrayKey>
    <div className="relative w-1/2 h-1/2">
      <Image
        src="/img/tie.svg"
        fill={true}
        alt="rest mode"
        className="object-contain"
      />
    </div>
  </GrayKey>
);

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col items-center absolute bg-keyboard w-full left-0 bottom-0 keyboardSafeArea">
      {children}
    </div>
  );
};

const Header = () => {
  return <div className="h-[48px]"></div>;
};

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-y-[6px] w-[98%] aspect-[1.85]">
      {children}
    </div>
  );
};

const KeyRow = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-5 grid-rows-1 gap-x-[6px] w-full h-full">
      {children}
    </div>
  );
};

const WhiteKey = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center bg-white active:bg-[#b4b8c1] rounded-[4px] shadow-[0_1px_#8d9095]">
      {children}
    </div>
  );
};

const GrayKey = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className="flex items-center justify-center bg-[#acaebb] active:bg-white rounded-[4px] shadow-[0_1px_#8d9095]"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex w-full h-[15px] bottom-0">{children}</div>;
};

const Handle = () => {
  return (
    <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px]"></div>
  );
};
