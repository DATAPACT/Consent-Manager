import { useTranslation } from "react-i18next";

function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <>
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("loading")}...</span>
        </div>
      </div>
    </>
  );
}

export default LoadingSpinner;
