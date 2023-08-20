import Image from "next/image";

export const Keyboard = () => {
  return (
    <Root>
      <Header />
      <Container>
        <KeyRow>
          <GrayKey>
            <Image
              src="/img/r4.png"
              fill={true}
              alt="rest mode"
              className="object-contain"
            />
          </GrayKey>
          <WhiteKey />
          <WhiteKey />
          <WhiteKey />
          <GrayKey />
        </KeyRow>
        <KeyRow>
          <GrayKey />
          <WhiteKey />
          <WhiteKey />
          <WhiteKey />
          <GrayKey />
        </KeyRow>
        <KeyRow>
          <GrayKey />
          <WhiteKey />
          <WhiteKey />
          <WhiteKey />
          <GrayKey />
        </KeyRow>
        <KeyRow>
          <GrayKey />
          <WhiteKey />
          <WhiteKey />
          <WhiteKey />
          <GrayKey />
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
      <div className="relative w-4/5 h-4/5">{children}</div>
    </div>
  );
};

const GrayKey = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center bg-[#acaebb] rounded-[4px] shadow-[0_1px_#8d9095]">
      <div className="relative w-4/5 h-4/5">{children}</div>
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
