import { useEffect, useState } from 'react';

/**
 * 获取当前系统的 Ctrl 键名称
 * 服务端和客户端初始渲染返回 "Ctrl"，避免 hydration 错误
 * 客户端 mount 后会根据系统更新为 "Control"（Mac）或 "Ctrl"（其他）
 */
export function useCtrlKey(): string {
  const [ctrlKey, setCtrlKey] = useState('Ctrl');

  useEffect(() => {
    const isMac = navigator.userAgent.indexOf('Macintosh') !== -1;
    setCtrlKey(isMac ? 'Control' : 'Ctrl');
  }, []);

  return ctrlKey;
}
