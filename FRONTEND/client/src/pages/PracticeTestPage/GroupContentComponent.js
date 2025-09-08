const GroupContent = ({ groupId, groupData }) => {
  const group = groupData.find((g) => g.id === groupId);
  if (!group) return null;

  const [imageSrc, setImageSrc] = React.useState(null);

  React.useEffect(() => {
    const loadImage = async () => {
      if (group.image_url1) {
        const cachedImage = await get(`image-${group.id}`);
        if (cachedImage) {
          const url = URL.createObjectURL(cachedImage);
          setImageSrc(url);
          return () => URL.revokeObjectURL(url);
        }
      }
    };
    loadImage();
  }, [group.id, group.image_url1]);

  return (
    <div className="group-content">
      <div className="group-image">
        {group.image_url1 && imageSrc ? (
          <img src={imageSrc} alt="Group Illustration" loading="lazy" />
        ) : null}
      </div>
      {group.media_name && /^\d+-\d+$/.test(group.media_name) && (
        <div className="group-name">Questions {group.media_name} refer to the following:</div>
      )}
      {group.paragrap_main && /[a-zA-Z]/.test(group.paragrap_main.replace(/\bp\b/g, '')) && (
        <div className="group-paragraph">
          <div dangerouslySetInnerHTML={{ __html: group.paragrap_main }} />
        </div>
      )}
    </div>
  );
};
