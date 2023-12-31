# Прототип помощника для водителей

![val_batch0_labels.jpg](model%2Fplots%2Fval_batch0_labels.jpg)
> In the realm where pixels meet prudence,
> 
> traffic signs are the beacons of safety,
>
> and object detection becomes the guardian angel of seamless navigation,
>
> weaving technology and traffic into a tapestry of secure passage.

## Описание проекта

Проект создан для точного и быстрого распознавания дорожных знаков в различных условиях освещения и погоды,
информирования водителя об ограничениях скорости, запретах, предупреждениях и других важных указаниях на дороге.

Модель распознавания знаков дорожного движения на вход получает видео и в режиме реального времени обрабатывает его,
детектируя и распознавая тип знаков по наибольшему соответствию.

**Команда:**

- [Одобеску Роман](https://github.com/RomanOdobesku)
- [Масленникова Татьяна](https://github.com/Tanchik24)
- [Габидуллин Владислав](https://github.com/Vladislav-GitHub)
- [Семина Анастасия](https://github.com/sad-bkt)
- [Прозоров Вячеслав](https://github.com/wiaci)

## Содержание репозитория

- В папке [model/notebooks](model/notebooks) содержатся jupyter ноутбуки с обучением моделей, сбором датасета
- В папке [model/plots](model/plots) содержатся графики качества моделей, скриншоты приложения, картинки из README.md
- В папке [model/weights](model/weights) содержатся веса моделей из экспериментов, описанных далее
- В папке [demonstration-app](/demonstration-app) содержатся фронтенд и бэкенд части приложения

## MVP

Разработка проекта включала в себя следующие шаги:

### 1. **Подготовка данных.**

Был проведен поиск и сравнение датасетов с фотографиями российских знаков, в результате которого было решено использовать
датасет [russian-traffic-signs-recognition dataset] (далее dataset 1), так как он представляет собой
репрезентативный набор данных с чёткими изображениями, к тому же, его можно скачать в разных форматах.

В ходе экспериментов этот датасет был расширен нами следующими датасетами:
[roud-signs-rus](https://universe.roboflow.com/ksenia-komlach/roud-signs-rus)
и [rp](https://universe.roboflow.com/kit-1kppr/rp-3jet1/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true),
результат можно найти [здесь](https://www.kaggle.com/datasets/anastasiiasemina1/signs4) (далее называем его dataset 2).

### 2. **Обучение и оценка моделей.**

Замеры качества и производительности моделей были произведены с помощью встроенных в фреймворки этих моделей CLI
инструментов. Графики можно также увидеть в [model/plots](model/plots).

Для сравнения были выбраны и обучены на подготовленном наборе данных следующие модели:

**[YOLOv8](https://docs.ultralytics.com/ru/)** ([краткое описание архитектуры тут](https://platinum-flame-ea1.notion.site/YOLOv8-0c49464a5f9d4fea9a76e5b18acd6fad))

1) dataset 1, 100 эпох, батч 16, optimizer Adam![yolo_dataset1_100.png](model%2Fplots%2Fyolo_dataset1_100.png)
   Качество на test:

   | Precision | Recall | mAP@50 | mAP@50-95 |
   |-----------|--------|--------|-----------|
   | 0.659     | 0.482  | 0.47   | 0.343     |
2) dataset 2, 100 эпох, батч 16, optimizer Adam![yolo_dataset2_100.png](model%2Fplots%2Fyolo_dataset2_100.png)
   Качество на test:

   | Precision | Recall | mAP@50 | mAP@50-95 |
   |-----------|--------|--------|-----------|
   | 0.647     | 0.418  | 0.437  | 0.307     |

   Так как в расширенном датасете была изменена только train часть, то есть вероятность, что в общем случае модель
   начала работать
   лучше, но на конкретно этой test выборке чуть хуже.

4) Был произведен поиск гиперпараметров lr0, lrf, momentum, weight_decay, warmup_epochs, warmup_momentum, box, cls с
   помощью Ray tune, но из-за продолжительного времени работы только на 20 эпохах. К сожалению, лучшего результата, чем
   были найдены, этот эксперимент не дал.
5) dataset 1, 200 эпох, батч 64, optimizer Adam![yolo_dataset1_200.png](model%2Fplots%2Fyolo_dataset1_200.png)
   Качество на test:

   | Precision | Recall | mAP@50 | mAP@50-95 |
   |-----------|--------|--------|-----------|
   | 0.698     | 0.454  | 0.524  | 0.389     |

Среднее время чистого инференса исходной модели 67 мс, ONNX модели 32 мс. ONNX модели явялются кроссплатформенными и
поддерживаются большинством фреймворков для Android и IOS.

[**RTMDet**](https://github.com/open-mmlab/mmdetection/tree/main)

1) dataset 1, 57 эпох, начала переобучаться, поэтому решили подбирать lr и weight_decay.
2) dataset1, 100 эпох, графики только для 70 эпох, потому что потом лосс начал расти.
   ![rtmdet_dataset1_70_loss.png](model%2Fplots%2Frtmdet_dataset1_70_loss.png)
   ![rtmdet_dataset1_70_mAP.png](model%2Fplots%2Frtmdet_dataset1_70_mAP.png)
   Качество на test:

   | bbox_mAP  | mAP_50 | mAP_75 |   mAP_m   |
   |-----------|--------|--------|-----------|
   |  0.352    | 0.474  | 0.417  |  0.5430   |

Среднее время чистого инференса RTMDet модели 81 мс, в ONNX формат не конвертировали, так как метрики лучше у YOLOv8.

#### Вывод

Таким образом, лучше всего оказалась переведенная в ONNX формат модель YOLOv8, она показала достойный результат в 32 мс
инференса на CPU (около 30 кадров в секунду), что подходит для использования на мобильных устройствах. Также есть
вариант инференса этой модели на GPU, тогда частота может достигать 200+ кадров в секунду, но в этом случае будут
возникать сетевые задержки при передаче изображений на сервер.

Оценка работы на 20-минутном видео (неверные = пропущенные + отнесенные к другому классу):
[![N|Solid](https://thumb.cloud.mail.ru/weblink/thumb/xw1/sMzg/6cpsVPwNs)](https://thumb.cloud.mail.ru/weblink/thumb/xw1/sMzg/6cpsVPwNs)

Частота верных детекций (accuracy) = 0.749.

Однако, стоит понимать, что некоторые знаки более важные, чем другие, поэтому можно было бы
считать взвешенную метрику, умножая каждый знак на его важность в зависимости от сферы применения данного приложения.

### 3. **Развёртывание модели.**

Было разработано веб-приложение с использованием библиотеки React, и создан пользовательский интерфейс для его
демонстрации:
![UI Image](model/plots/frontend_image.png)

В качестве модели взята YOLOv8 из 4) эксперимента с [весами](demonstration-app%2Fbackend%2Fbest_yolo_experiment4.onnx).

#### Фреймворки/библиотеки

Для правильной работы наше приложение использует ряд библиотек и фреймворков с открытым исходным кодом.

Для клиентской части приложения:

- [React](https://react.dev/reference/react)
- [Axios](https://axios-http.com)

Для серверной части приложения:

- [Fastapi](https://fastapi.tiangolo.com/)
- [Onnx](https://onnx.ai/onnx/)
- [Onnxruntime](https://onnxruntime.ai/docs)
- [Ultralytics](https://github.com/ultralytics/ultralytics) v8.0.215+ для запуска YOLOv8
- [Uvicorn](https://www.uvicorn.org/)

#### Установка

Запуск клиентской части приложения:

```sh
cd demonstration-app/frontend
npm i
npm start
```

Запуск серверной части приложения:

```sh
cd demonstration-app/backend
pip install -r requirements.txt
uvicorn main:app
```
#### Docker

Наша модель проста в установке и деплое в docker-контейнере.

Для работы приложения надо освободить 3000 и 8000 порты.

Развертывание приложения:

```sh
cd demonstration-app
docker-compose up -d
```

> Заметка: Убедитесь, что другие копии контейнеров не запущены. Используйте `docker ps` для вывода списка контейнеров
> и `docker rm -f <ids>` для их удаления..

Проверьте развертывание, перейдя по адресу вашего сервера в предпочитаемом вами
браузере: http://localhost:3000.
```sh
127.0.0.1:3000
```

## Метрики

### Метрики обнаружения объектов

    Средняя точность (AP): AP вычисляет площадь под кривой точности (Precision) и полноты (Recall), предоставляя одно значение, которое отражает точность модели и производительность полноты.

    (mAP): mAP расширяет концепцию AP, вычисляя средние значения AP для нескольких классов объектов. Это полезно в сценариях обнаружения объектов с несколькими классами, чтобы обеспечить всестороннюю оценку производительности модели.

| Метрика                           | Описание                                                                                                                                                                                       | Для чего нужна                                                                                                           |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| IoU                               | Количественно определяет перекрытие между прогнозируемыми ограничивающими bboxes и истинными ограничивающими bboxes.                                                                           | Необходим при точном определении местоположения объектов.                                                                |
| Precision (Точность)              | Доля истинных положительных результатов среди всех положительных прогнозов. Оценивается способность модели избегать ложных положительных результатов.                                          | Важна при минимизации ложных обнаружений.                                                                                |
| Recall (Полнота)                  | Способность модели идентифицировать все экземпляры объектов на изображениях.                                                                                                                   | Критична, когда важно обнаружить каждый экземпляр объекта.                                                               |
| mAP@50                            | Средняя точность, рассчитанная при пороге IoU = 0,50. Мера точности модели, учитывающая только "легкие" обнаружения.                                                                           | Подходит для общей оценки производительности модели.                                                                     |
| mAP@50-95                         | Среднее значение средней точности, рассчитанной при различных порогах IoU от 0,50 до 0,95. Предоставляет всесторонний обзор производительности модели на разных уровнях сложности обнаружения. | Подходит для общей оценки производительности модели.                                                                     |
| F1 Score                          | Гармоническое среднее между значениями Precision и Recall.                                                                                                                                     | Сбалансированная оценку производительности модели с учетом как ложноположительных, так и ложноотрицательных результатов. |
| Для приложений в реальном времени | Метрики скорости, такие как FPS (кадры в секунду) и задержка.                                                                                                                                  | Критичны для обеспечения своевременных результатов.                                                                      |

| Интерпретация результатов       | Часто наблюдаемые низкие показатели и их возможные интерпретации                                                               |
|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Низкий mAP                      | Указывает на то, что модель может требовать общих улучшений.                                                                   |
| Низкий IoU                      | Модель может испытывать трудности в точном определении местоположения объектов. Методы разметки границ могут помочь.           |
| Низкий Precision                | Модель может обнаруживать слишком много несуществующих объектов. Подстройка порогов уверенности может уменьшить это.           |
| Низкий Recall                   | Модель может упускать настоящие объекты. Улучшение извлечения признаков или использование большего объема данных может помочь. |
| Несбалансированный F1 Score     | Имеется неравенство между точностью и полнотой.                                                                                |
| Class-specific AP               | Низкие баллы могут выявить классы, с которыми модель имеет трудности.                                                          |
### Бизнес-метрики

| Метрика                            | Описание                                                                                                                                                                       |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Количество инцидентов              | Измерение эффективности системы, связанной с упущенными или неправильно распознанными знаками. Если ошибок много - приложением не будут пользоваться.                          |
| Стоимость ошибок                   | Бизнес-затраты, связанные с ложными срабатываниями (неправильное обнаружение знаков) и ложными пропусками (пропуск знаков), например, последствия в виде штрафов за нарушение. |
| Время обработки                    | Время, необходимое системе для обнаружения знаков. Более быстрое время обработки может быть решающим, особенно в приложениях, работающих в реальном времени.                   |
| Использование ресурсов             | Эффективное использование ресурсов (памяти, вычислительных ресурсов).                                                                                                          |
| Пользовательский опыт              | Оценка влияния на пользовательский опыт.                                                                                                                                       |
| Масштабируемость системы           | Способность системы распознавания знаков масштабироваться с увеличением потребностей бизнеса.                                                                                  |
| Окупаемость вложений (ROI)         | Измерение финансового воздействия внедрения системы, учитывая как затраты, так и выгоды.                                                                                       |
| Затраты на обучение и обслуживание | Оценка стоимости и времени, необходимых для обслуживания IT-решения.                                                                                                           |
| Адаптивность                       | Оценка, насколько легко система распознавания знаков может адаптироваться к изменениям в знаках, условиях окружающей среды или другим переменным.                              |

## Лицензия

**Sigma Intelligence**

   [russian-traffic-signs-recognition dataset]: <https://universe.roboflow.com/mguogareva/russian-traffic-signs-recognition/model/1>
