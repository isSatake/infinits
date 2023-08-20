import Image from "next/image";

export const Keyboard = () => {
  return (
    <Root>
      <Header />
      <Container>
        <KeyRow>
          <GrayKey>
            <div className="relative w-2/3 h-2/3">
              <Image
                src="/img/r4.png"
                fill={true}
                alt="rest mode"
                className="object-contain"
              />
            </div>
          </GrayKey>
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
        </KeyRow>
        <KeyRow>
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
          <WhiteKey>
            <div className="relative w-1/4 h-2/3">
              <Image
                src="/img/n8.png"
                fill={true}
                alt="rest mode"
                className="object-contain"
              />
            </div>
          </WhiteKey>
          <WhiteKey>
            <div className="relative w-1/4 h-2/3">
              <Image
                src="/img/n16.png"
                fill={true}
                alt="rest mode"
                className="object-contain"
              />
            </div>
          </WhiteKey>
          <WhiteKey>
            <div className="relative w-1/4 h-2/3">
              <Image
                src="/img/n32.png"
                fill={true}
                alt="rest mode"
                className="object-contain"
              />
            </div>
          </WhiteKey>
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
        </KeyRow>
        <KeyRow>
          <GrayKey>
            <div className="relative w-2/5 h-2/5">
              <Image
                src="/img/nobeam.png"
                fill={true}
                alt="rest mode"
                className="object-contain"
              />
            </div>
          </GrayKey>
          <WhiteKey />
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
        </KeyRow>
        <KeyRow>
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
        </KeyRow>
      </Container>
      <Footer>
        {/* desktop only */}
        {/* <Handle /> */}
      </Footer>
    </Root>
  );
};

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
    <div className="flex items-center justify-center bg-white  bg-no-repeat bg-center rounded-[4px] shadow-[0_1px_#8d9095]">
      {children}
    </div>
  );
};

const GrayKey = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center bg-[#acaebb] rounded-[4px] shadow-[0_1px_#8d9095]">
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
