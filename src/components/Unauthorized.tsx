import { useTranslation } from "react-i18next";
import styles from "../css/Dashboard.module.css";

function Unauthorized() {
  const { t } = useTranslation();
  return (
    <>
      <div className="container text-center" style={{ marginTop: "13%" }}>
        <h1 style={{ fontSize: "100px" }}>401</h1>
        <h4>{t("forbidden")}</h4>
        <p>{t("access_to_this_source_denied")}</p>
        <button
          className={`${styles.primaryButton} btn mt-2`}
          onClick={() => {
            window.history.back();
            setTimeout(() => window.location.reload(), 100);
          }}
        >
          {t("back")}
        </button>
      </div>
    </>
  );
}

export default Unauthorized;
