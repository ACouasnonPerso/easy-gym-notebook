$baseDir = 'C:\Users\Anatole\Desktop\code\easy-gym-notebook\src\app\assets\i18n'

function Make-Block {
    param($buttonLabel, $title, $body, $inputLabel, $inputPlaceholder, $confirmWord, $successMessage, $errorMessage)
    $obj = [PSCustomObject]@{
        buttonLabel = $buttonLabel
        title = $title
        body = $body
        inputLabel = $inputLabel
        inputPlaceholder = $inputPlaceholder
        confirmWord = $confirmWord
        successMessage = $successMessage
        errorMessage = $errorMessage
    }
    return $obj
}

$blocks = @{
    'en.json' = Make-Block 'Delete all data' 'Delete all data' 'This will permanently delete all your sessions and exercises. This action cannot be undone.' 'Type «Supprimer» to confirm' 'Supprimer' 'Supprimer' 'All data deleted' 'An error occurred. Please try again.'
    'fr.json' = Make-Block 'Supprimer toutes les données' 'Supprimer toutes les données' 'Cela supprimera définitivement toutes vos séances et exercices. Cette action est irréversible.' 'Tapez «Supprimer» pour confirmer' 'Supprimer' 'Supprimer' 'Toutes les données supprimées' 'Une erreur est survenue. Veuillez réessayer.'
    'de.json' = Make-Block 'Alle Daten löschen' 'Alle Daten löschen' 'Dadurch werden alle Ihre Einheiten und Übungen dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.' 'Geben Sie «Löschen» ein, um zu bestätigen' 'Löschen' 'Löschen' 'Alle Daten gelöscht' 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
    'es.json' = Make-Block 'Eliminar todos los datos' 'Eliminar todos los datos' 'Esto eliminará permanentemente todas sus sesiones y ejercicios. Esta acción no se puede deshacer.' 'Escriba «Eliminar» para confirmar' 'Eliminar' 'Eliminar' 'Todos los datos eliminados' 'Ocurrió un error. Por favor, inténtelo de nuevo.'
    'it.json' = Make-Block 'Elimina tutti i dati' 'Elimina tutti i dati' 'Questo eliminerà permanentemente tutte le sessioni e gli esercizi. Questa azione non può essere annullata.' 'Digita «Elimina» per confermare' 'Elimina' 'Elimina' 'Tutti i dati eliminati' 'Si è verificato un errore. Riprova.'
    'pt.json' = Make-Block 'Eliminar todos os dados' 'Eliminar todos os dados' 'Isso eliminará permanentemente todas as suas sessões e exercícios. Esta ação não pode ser desfeita.' 'Digite «Eliminar» para confirmar' 'Eliminar' 'Eliminar' 'Todos os dados eliminados' 'Ocorreu um erro. Por favor, tente novamente.'
    'nl.json' = Make-Block 'Alle gegevens verwijderen' 'Alle gegevens verwijderen' 'Dit zal al uw sessies en oefeningen permanent verwijderen. Deze actie kan niet ongedaan worden gemaakt.' 'Typ «Verwijderen» om te bevestigen' 'Verwijderen' 'Verwijderen' 'Alle gegevens verwijderd' 'Er is een fout opgetreden. Probeer het opnieuw.'
    'pl.json' = Make-Block 'Usuń wszystkie dane' 'Usuń wszystkie dane' 'Spowoduje to trwałe usunięcie wszystkich sesji i ćwiczeń. Tej czynności nie można cofnąć.' 'Wpisz «Usuń» aby potwierdzić' 'Usuń' 'Usuń' 'Wszystkie dane usunięte' 'Wystąpił błąd. Spróbuj ponownie.'
    'ru.json' = Make-Block 'Удалить все данные' 'Удалить все данные' 'Это навсегда удалит все ваши сеансы и упражнения. Это действие нельзя отменить.' 'Введите «Удалить» для подтверждения' 'Удалить' 'Удалить' 'Все данные удалены' 'Произошла ошибка. Пожалуйста, попробуйте снова.'
    'ar.json' = Make-Block 'حذف جميع البيانات' 'حذف جميع البيانات' 'سيؤدي هذا إلى حذف جميع جلساتك وتمريناتك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.' 'اكتب «احذف» للتأكيد' 'احذف' 'احذف' 'تم حذف جميع البيانات' 'حدث خطأ. يرجى المحاولة مجددًا.'
    'hi.json' = Make-Block 'सभी डेटा हटाएं' 'सभी डेटा हटाएं' 'यह आपके सभी सत्रों और व्यायामों को स्थायी रूप से हटा देगा. इस क्रिया को पूर्ववत नहीं किया जा सकता.' '«हटाएं» टाइप करके पुष्टि करें' 'हटाएं' 'हटाएं' 'सभी डेटा हटा दिया गया' 'एक त्रुटि हुई. कृपया पुनः प्रयास करें.'
    'ja.json' = Make-Block 'すべてのデータを削除' 'すべてのデータを削除' 'すべてのセッションとエクササイズが完全に削除されます。この操作は元に戻せません。' '«削除»と入力して確認' '削除' '削除' 'すべてのデータが削除されました' 'エラーが発生しました。もう一度お試しください。'
    'ko.json' = Make-Block '모든 데이터 삭제' '모든 데이터 삭제' '모든 세션과 운동이 영구적으로 삭제됩니다. 이 작업은 실행 취소할 수 없습니다.' '«삭제»를 입력하여 확인' '삭제' '삭제' '모든 데이터가 삭제되었습니다' '오류가 발생했습니다. 다시 시도해 주세요.'
    'sv.json' = Make-Block 'Ta bort alla data' 'Ta bort alla data' 'Detta kommer permanent att ta bort alla dina sessioner och övningar. Denna åtgärd kan inte ångras.' 'Skriv «Ta bort» för att bekräfta' 'Ta bort' 'Ta bort' 'All data borttagen' 'Ett fel uppstod. Försök igen.'
    'th.json' = Make-Block 'ลบข้อมูลทั้งหมด' 'ลบข้อมูลทั้งหมด' 'การกระทำนี้จะลบเซสชันและแบบฝึกหัดทั้งหมดของคุณอย่างถาวร ไม่สามารถยกเลิกได้' 'พิมพ์ «ลบ» เพื่อยืนยัน' 'ลบ' 'ลบ' 'ลบข้อมูลทั้งหมดแล้ว' 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    'tr.json' = Make-Block 'Tüm verileri sil' 'Tüm verileri sil' 'Bu, tüm oturumlarınızı ve egzersizlerinizi kalıcı olarak silecektir. Bu işlem geri alınamaz.' 'Onaylamak için «Sil» yazın' 'Sil' 'Sil' 'Tüm veriler silindi' 'Bir hata oluştu. Lütfen tekrar deneyin.'
    'vi.json' = Make-Block 'Xóa tất cả dữ liệu' 'Xóa tất cả dữ liệu' 'Thao tác này sẽ xóa vĩnh viễn tất cả các phiên tập và bài tập của bạn. Không thể hoàn tác.' 'Nhập «Xóa» để xác nhận' 'Xóa' 'Xóa' 'Đã xóa tất cả dữ liệu' 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

foreach ($file in $blocks.Keys) {
    $filePath = Join-Path $baseDir $file
    $rawContent = Get-Content $filePath -Raw -Encoding UTF8
    $content = $rawContent | ConvertFrom-Json

    if ($content.PSObject.Properties.Name -contains 'deleteAllData') {
        Write-Host "${file}: already has deleteAllData, skipping"
        continue
    }

    $content | Add-Member -NotePropertyName 'deleteAllData' -NotePropertyValue $blocks[$file]
    $json = $content | ConvertTo-Json -Depth 10 -EscapeHandling Default
    [System.IO.File]::WriteAllText($filePath, $json, [System.Text.Encoding]::UTF8)
    Write-Host "${file}: added deleteAllData block"
}

Write-Host 'All done!'
