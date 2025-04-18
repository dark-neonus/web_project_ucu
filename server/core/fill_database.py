from server.core.database import get_db
from server.apps.authentication.models import User
from server.apps.events.models import Event, EventCategory
from server.core.security import hash_password
from sqlalchemy.orm import Session
import datetime
import random

def fill_db():
    # Fill the database with initial data if needed
    db: Session = next(get_db())
    # db_user = db.query(User).filter(User.email == user.email).first()
    # if db_user:
    #     raise HTTPException(status_code=400, detail="Email already registered")

    user_1 = User(
        first_name="Nazar",
        last_name="Pasichnyk",
        email="nazar@gmail.com",
        hashed_password=hash_password('1234')
    )
    db.add(user_1)
    db.commit()
    db.refresh(user_1)

    user_2 = User(
        first_name="Roman",
        last_name="Prokhorov",
        email="roman@gmail.com",
        hashed_password=hash_password('1234')
    )
    db.add(user_2)
    db.commit()
    db.refresh(user_2)

    user_3 = User(
        first_name="Daryna",
        last_name="Nechyporuk",
        email="daryna@gmail.com",
        hashed_password=hash_password('1234')
    )
    db.add(user_3)
    db.commit()
    db.refresh(user_3)

    user_4 = User(
        first_name="Olesia",
        last_name="Karpina",
        email="olesia@gmail.com",
        hashed_password=hash_password('1234')
    )
    db.add(user_4)
    db.commit()
    db.refresh(user_4)

    user_5 = User(
        first_name="Козак",
        last_name="Васильович",
        email="kozak@gmail.com",
        hashed_password=hash_password('1234')
    )
    db.add(user_5)
    db.commit()
    db.refresh(user_5)

    bulk_users = []

    for i in range(6, 20):
        bulk_user = User(
            first_name=f"BulkUser{i}",
            last_name="Bulkington",
            email=f"bulk{i}@gmail.com",
            hashed_password=hash_password('1234')
        )
        bulk_users.append(bulk_user)
        db.add(bulk_user)
        db.commit()
        db.refresh(bulk_user)
    
    event_1 = Event(
        title="Networking meetup",
        description="You can meet with other people cool people and share your experience",
        date_scheduled=datetime.datetime(2025, 10, 1, 18, 0),
        category=EventCategory.NETWORKING,
        author_id=user_1.id,
        location="Lviv"
    )

    db.add(event_1)
    db.commit()
    db.refresh(event_1)

    event_2 = Event(
        title="Charity convert at FEST",
        description="Come to our charity concert and help us to raise money for the army",
        date_scheduled=datetime.datetime(2025, 7, 3, 19, 0),
        category=EventCategory.CHARITY,
        author_id=user_2.id,
        location="Lviv, FEST"
    )

    db.add(event_2)
    db.commit()
    db.refresh(event_2)


    for i in range(3, 50):
        bulk_event = Event(
            title=f"Event {i}",
            description="This is a sample event description.",
            date_scheduled=datetime.datetime(
                random.randint(2024, 2027),
                random.randint(1, 11),
                random.randint(1, 29),
                random.randint(9, 20),
                0),
            category=random.choice(list(EventCategory)),
            author_id=(random.choice([user_1, user_2, user_3, user_4] + bulk_users)).id,
            location=random.choice(["Lviv", "Kyiv", "Odesa", "Kharkiv", "Dnipro"])
        )
        db.add(bulk_event)
        db.commit()
        db.refresh(bulk_event)

    print("Database filled with initial data.")
    
