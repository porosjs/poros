import React from "react";
import { ConfigProvider } from "metis-ui";
import merge from "{{{lodashPath.merge}}}";
import { ApplyPluginsType } from "umi";
import { getPluginManager } from "../core/plugin";
import { MetisUIConfigContext, MetisUIConfigContextSetter } from "./context";


let runtimeConfig = null;

const getRuntimeConfig = () => {
  if(!runtimeConfig){
    runtimeConfig = getPluginManager().applyPlugins({
      key: "metisui",
      type: ApplyPluginsType.modify,
      initialValue: {{{configProvider}}},
    });
  }
  return runtimeConfig;
}

function MetisUIProvider({ children }) {
  const [metisuiConfig, _setMetisUIConfig] = React.useState(getRuntimeConfig);

  const setMetisUIConfig: typeof _setMetisUIConfig = (newConfig) => {
    _setMetisUIConfig((prev) => {
      return merge(
        {},
        prev,
        typeof newConfig === "function" ? newConfig(prev) : newConfig
      );
    });
  };

  if (metisuiConfig.prefixCls) {
    ConfigProvider.config({
      prefixCls: metisuiConfig.prefixCls,
    });
  }

  const contextValue = React.useMemo(() => {
    return [
      metisuiConfig,
      setMetisUIConfig,
    ];
  }, [metisuiConfig, setMetisUIConfig]);

  return (
    <MetisUIConfigContext.Provider value={contextValue}>
      <ConfigProvider {...metisuiConfig}>{children}</ConfigProvider>
    </MetisUIConfigContext.Provider>
  );
}

export function rootContainer(children) {
  return <MetisUIProvider>{children}</MetisUIProvider>;
}
