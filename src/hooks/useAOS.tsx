import { useEffect } from "react";
import AOS from "aos";

// 提取 AOS 初始化配置常量
const AOS_CONFIG = {
  offset: 100,
  duration: 700,
  easing: "ease-out-quad",
  once: true,
};

const useAOS = () => {
  useEffect(() => {
    try {
      // 初始化 AOS
      AOS.init(AOS_CONFIG);
      // 监听页面加载完成事件，刷新 AOS
      const loadHandler = () => AOS.refresh();
      window.addEventListener("load", loadHandler);

      // 组件卸载时移除事件监听器，避免内存泄漏
      return () => {
        window.removeEventListener("load", loadHandler);
      };
    } catch (error) {
      console.error("AOS 初始化出错:", error);
    }
  }, []);
};

export default useAOS;
