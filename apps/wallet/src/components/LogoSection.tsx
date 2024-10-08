import { FC } from "react";
import { Trans } from "react-i18next";

const LogoSection: FC = () => {
  return (
    <section className="flex-1 flex flex-col justify-center items-center">
      <img src="/brand@2x.png" alt="Brand" className="w-[160px] h-[102px]" />
      {/* <div className="flex justify-center items-center size-20 rounded-full [background:linear-gradient(180deg,#16D6FF_0%,#0099E6_100%)]">
        <SvgLogo className="size-9" />
      </div> */}
      <h1 className="mt-2 text-neutral">Hibit ID</h1>
      <p className="mt-2 font-bold text-xl">
        <Trans
          i18nKey="logo_section_desc"
          components={{
            Web3Span: <span className="text-primary">Web3.0</span>,
          }}
        />
      </p>
    </section>
  )
}

export default LogoSection;
