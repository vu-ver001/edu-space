export const DynamicIcon = ({ iconData }: { iconData: string }) => {
    if (!iconData) return <span className="dynamic-emoji-icon">📁</span>;

    const data = iconData.trim();
    if (data.startsWith('<svg')) {
        return <div className="dynamic-svg-wrapper" dangerouslySetInnerHTML={{ __html: data }} />;
    }
    if (data.startsWith('http') || data.startsWith('/')) {
        return <img src={data} alt="icon" className="dynamic-img-icon" />;
    }
    if (data.includes('fa-') || data.includes('bx-') || data.includes('icon-')) {
        return <i className={`${data} dynamic-font-icon`}></i>;
    }
    return <span className="dynamic-emoji-icon">{data}</span>;
};